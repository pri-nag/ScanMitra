import { BookingType } from "@prisma/client";

export type SlotStatus = "available" | "walkin_only" | "full";

export interface SlotInfo {
  time: string;
  onlineBooked: number;
  walkInBooked: number;
  onlineCapacity: number;
  walkInCapacity: number;
  totalCapacity: number;
  status: SlotStatus;
}

/**
 * Calculates slot capacities based on 80/20 rule
 */
export function calculateCapacities(totalPerSlot: number) {
  let onlineCapacity = Math.floor(totalPerSlot * 0.8);
  let walkInCapacity = Math.ceil(totalPerSlot * 0.2);

  // If total capacity is 1 or more, ensure at least 1 online slot
  // so that online booking is not completely blocked by rounding.
  if (totalPerSlot >= 1 && onlineCapacity === 0) {
    onlineCapacity = 1;
    // If we only have 1 slot total, walk-in will have to be overflow-only
    if (totalPerSlot === 1) {
      walkInCapacity = 0;
    }
  }

  return { onlineCapacity, walkInCapacity };
}

/**
 * Determines the status of a slot based on current bookings and capacities
 */
export function getSlotStatus(
  onlineBooked: number,
  walkInBooked: number,
  onlineCapacity: number,
  walkInCapacity: number
): SlotStatus {
  const totalBooked = onlineBooked + walkInBooked;
  const totalCapacity = onlineCapacity + walkInCapacity;

  if (totalBooked >= totalCapacity) return "full";

  // Online patients are blocked if online cap is reached
  // Even if walk-in slots remain, they are reserved for walk-ins
  const onlineFull = onlineBooked >= onlineCapacity;
  
  if (onlineFull) return "walkin_only";

  return "available";
}

/**
 * Validates if a new booking of a specific type is allowed
 */
export function canBook(
  type: BookingType,
  onlineBooked: number,
  walkInBooked: number,
  onlineCapacity: number,
  walkInCapacity: number
): { allowed: boolean; error?: string; warning?: string } {
  const totalBooked = onlineBooked + walkInBooked;
  const totalCapacity = onlineCapacity + walkInCapacity;

  if (totalBooked >= totalCapacity) {
    return { allowed: false, error: "This slot is completely full" };
  }

  if (type === BookingType.ONLINE) {
    if (onlineBooked >= onlineCapacity) {
      return { allowed: false, error: "Online slots for this time are full. Please choose another slot." };
    }
  }

  if (type === BookingType.WALK_IN) {
    if (walkInBooked >= walkInCapacity) {
      return { 
        allowed: true, 
        warning: "Walk-in cap reached — using an online slot" 
      };
    }
  }

  return { allowed: true };
}
