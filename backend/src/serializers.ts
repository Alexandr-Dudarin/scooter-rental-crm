interface ScooterRow {
  id: string;
  number: string;
  model: string;
  status: "available" | "in_use" | "maintenance" | "offline";
  battery_level: number;
  latitude: number | string;
  longitude: number | string;
  updated_at: Date | string;
}

interface RentalRow {
  id: string;
  scooter_id: string;
  scooter_number: string;
  scooter_model: string;
  user_name: string;
  user_phone: string;
  started_at: Date | string;
  ended_at: Date | string | null;
  status: "active" | "completed";
}

export function serializeScooter(row: ScooterRow) {
  return {
    id: row.id,
    number: row.number,
    model: row.model,
    status: row.status,
    batteryLevel: Number(row.battery_level),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export function serializeRental(row: RentalRow) {
  return {
    id: row.id,
    scooterId: row.scooter_id,
    scooterNumber: row.scooter_number,
    scooterModel: row.scooter_model,
    userName: row.user_name,
    userPhone: row.user_phone,
    startedAt: new Date(row.started_at).toISOString(),
    endedAt: row.ended_at ? new Date(row.ended_at).toISOString() : null,
    status: row.status
  };
}
