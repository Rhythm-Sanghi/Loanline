import {
  LoanRequest,
  LaptopAsset,
  IncompatibilityReason,
  CompatibilityCheck,
} from '../types/domain';

/**
 * Shared compatibility evaluator.
 * An edge exists between request R and laptop L if and only if:
 * 1. L.status === 'Ready'
 * 2. L.chargerVerified === 'yes'
 * 3. R.allowedDesks includes L.pickupDesk
 * 4. L.ramGb >= R.minRamGb
 * 5. (!R.batteryRequired || L.batteryVerified === 'yes')
 *
 * Exposes all failing constraints with structured reason codes.
 */
export function checkCompatibility(
  request: LoanRequest,
  laptop: LaptopAsset
): CompatibilityCheck {
  const reasons: IncompatibilityReason[] = [];

  // Check 1: Status must be Ready
  if (laptop.status !== 'Ready') {
    reasons.push({
      code: 'STATUS_NOT_READY',
      label: `Device in ${laptop.status}`,
      detail: `Asset ${laptop.id} is marked as '${laptop.status}', not 'Ready'.`,
    });
  }

  // Check 2: Charger must be verified
  if (laptop.chargerVerified !== 'yes') {
    reasons.push({
      code: 'CHARGER_UNVERIFIED',
      label: 'Charger unverified',
      detail: `Asset ${laptop.id} does not have a verified charger recorded.`,
    });
  }

  // Check 3: Pickup desk must match one of the allowed desks
  if (!request.allowedDesks.includes(laptop.pickupDesk)) {
    reasons.push({
      code: 'DESK_MISMATCH',
      label: `Desk mismatch (${laptop.pickupDesk})`,
      detail: `Asset is at ${laptop.pickupDesk} desk, but request allows: [${request.allowedDesks.join(', ')}].`,
    });
  }

  // Check 4: RAM must meet minimum
  if (laptop.ramGb < request.minRamGb) {
    reasons.push({
      code: 'INSUFFICIENT_RAM',
      label: `RAM insufficient (${laptop.ramGb} GB < ${request.minRamGb} GB)`,
      detail: `Asset has ${laptop.ramGb} GB RAM; request requires at least ${request.minRamGb} GB.`,
    });
  }

  // Check 5: Battery must be verified portable if requested
  if (request.batteryRequired && laptop.batteryVerified !== 'yes') {
    reasons.push({
      code: 'BATTERY_UNVERIFIED',
      label: 'Portable battery unverified',
      detail: `Request requires a verified portable battery, but asset ${laptop.id} has battery verified as '${laptop.batteryVerified}'.`,
    });
  }

  return {
    isCompatible: reasons.length === 0,
    reasons,
  };
}

/**
 * Returns all laptops compatible with the given request.
 */
export function getCompatibleLaptops(
  request: LoanRequest,
  laptops: LaptopAsset[]
): LaptopAsset[] {
  return laptops.filter((laptop) => checkCompatibility(request, laptop).isCompatible);
}
