import { describe, it, expect } from 'vitest';
import { checkCompatibility } from '../domain/compatibility';
import { LoanRequest, LaptopAsset } from '../types/domain';

describe('Compatibility Evaluator', () => {
  const baseReq: LoanRequest = {
    id: 'Q-01',
    queueTimestamp: '2026-11-20T09:00:00Z',
    allowedDesks: ['North'],
    minRamGb: 8,
    batteryRequired: false,
  };

  const baseLaptop: LaptopAsset = {
    id: 'LT-01',
    pickupDesk: 'North',
    ramGb: 8,
    chargerVerified: 'yes',
    batteryVerified: 'yes',
    status: 'Ready',
  };

  it('approves a fully compatible pairing', () => {
    const result = checkCompatibility(baseReq, baseLaptop);
    expect(result.isCompatible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('rejects if status is not Ready (e.g. Repair or Held)', () => {
    const repairLaptop: LaptopAsset = { ...baseLaptop, status: 'Repair' };
    const res1 = checkCompatibility(baseReq, repairLaptop);
    expect(res1.isCompatible).toBe(false);
    expect(res1.reasons.some((r) => r.code === 'STATUS_NOT_READY')).toBe(true);

    const heldLaptop: LaptopAsset = { ...baseLaptop, status: 'Held' };
    const res2 = checkCompatibility(baseReq, heldLaptop);
    expect(res2.isCompatible).toBe(false);
    expect(res2.reasons.some((r) => r.code === 'STATUS_NOT_READY')).toBe(true);
  });

  it('rejects if charger is unverified even if status is Ready', () => {
    const unverifiedCharger: LaptopAsset = { ...baseLaptop, chargerVerified: 'no' };
    const res = checkCompatibility(baseReq, unverifiedCharger);
    expect(res.isCompatible).toBe(false);
    expect(res.reasons.some((r) => r.code === 'CHARGER_UNVERIFIED')).toBe(true);
  });

  it('rejects desk mismatch', () => {
    const southLaptop: LaptopAsset = { ...baseLaptop, pickupDesk: 'South' };
    const res = checkCompatibility(baseReq, southLaptop);
    expect(res.isCompatible).toBe(false);
    expect(res.reasons.some((r) => r.code === 'DESK_MISMATCH')).toBe(true);
  });

  it('allows pairing if request allows multiple desks including laptop desk', () => {
    const multiDeskReq: LoanRequest = { ...baseReq, allowedDesks: ['South', 'North'] };
    const southLaptop: LaptopAsset = { ...baseLaptop, pickupDesk: 'South' };
    const res = checkCompatibility(multiDeskReq, southLaptop);
    expect(res.isCompatible).toBe(true);
  });

  it('rejects if RAM is less than minimum', () => {
    const highRamReq: LoanRequest = { ...baseReq, minRamGb: 16 };
    const res = checkCompatibility(highRamReq, baseLaptop); // baseLaptop has 8GB
    expect(res.isCompatible).toBe(false);
    expect(res.reasons.some((r) => r.code === 'INSUFFICIENT_RAM')).toBe(true);
  });

  it('allows if RAM exceeds minimum', () => {
    const highRamLaptop: LaptopAsset = { ...baseLaptop, ramGb: 32 };
    const res = checkCompatibility(baseReq, highRamLaptop);
    expect(res.isCompatible).toBe(true);
  });

  it('rejects unverified portable battery only when battery is required', () => {
    const unverifiedBatteryLaptop: LaptopAsset = { ...baseLaptop, batteryVerified: 'no' };

    // Request does not require battery
    const resNoReq = checkCompatibility(baseReq, unverifiedBatteryLaptop);
    expect(resNoReq.isCompatible).toBe(true);

    // Request requires battery
    const reqWithBattery: LoanRequest = { ...baseReq, batteryRequired: true };
    const resWithReq = checkCompatibility(reqWithBattery, unverifiedBatteryLaptop);
    expect(resWithReq.isCompatible).toBe(false);
    expect(resWithReq.reasons.some((r) => r.code === 'BATTERY_UNVERIFIED')).toBe(true);
  });

  it('exposes multiple constraints when several rules fail simultaneously', () => {
    const failingLaptop: LaptopAsset = {
      id: 'LT-BAD',
      pickupDesk: 'South', // Desk mismatch
      ramGb: 4, // Insufficient RAM (needs 16)
      chargerVerified: 'no', // Charger unverified
      batteryVerified: 'no', // Battery unverified
      status: 'Repair', // Not ready
    };

    const demandingReq: LoanRequest = {
      id: 'Q-DEMAND',
      queueTimestamp: '2026-11-20T09:00:00Z',
      allowedDesks: ['North'],
      minRamGb: 16,
      batteryRequired: true,
    };

    const res = checkCompatibility(demandingReq, failingLaptop);
    expect(res.isCompatible).toBe(false);
    expect(res.reasons.length).toBe(5);
    const codes = res.reasons.map((r) => r.code);
    expect(codes).toContain('STATUS_NOT_READY');
    expect(codes).toContain('CHARGER_UNVERIFIED');
    expect(codes).toContain('DESK_MISMATCH');
    expect(codes).toContain('INSUFFICIENT_RAM');
    expect(codes).toContain('BATTERY_UNVERIFIED');
  });
});
