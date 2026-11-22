export const SAMPLE_REQUESTS = [
    {
        id: 'Q-01',
        queueTimestamp: '2026-11-20T09:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8,
        batteryRequired: false,
    },
    {
        id: 'Q-02',
        queueTimestamp: '2026-11-20T09:15:00Z',
        allowedDesks: ['North'],
        minRamGb: 16,
        batteryRequired: false,
    },
    {
        id: 'Q-03',
        queueTimestamp: '2026-11-20T09:30:00Z',
        allowedDesks: ['South'],
        minRamGb: 8,
        batteryRequired: false,
    },
    {
        id: 'Q-04',
        queueTimestamp: '2026-11-20T09:45:00Z',
        allowedDesks: ['South'],
        minRamGb: 8,
        batteryRequired: true,
    },
];
export const SAMPLE_LAPTOPS = [
    {
        id: 'LT-01',
        pickupDesk: 'North',
        ramGb: 16,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
    },
    {
        id: 'LT-02',
        pickupDesk: 'North',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'no',
        status: 'Ready',
    },
    {
        id: 'LT-03',
        pickupDesk: 'South',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'no',
        status: 'Ready',
    },
    {
        id: 'LT-04',
        pickupDesk: 'South',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Repair',
    },
];
export const INITIAL_WORKSPACE = {
    version: 1,
    requests: SAMPLE_REQUESTS,
    laptops: SAMPLE_LAPTOPS,
    updatedAt: '2026-11-20T10:00:00Z',
};
