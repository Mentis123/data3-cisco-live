export interface FlightProfile {
  /** Lift force applied when the bird is holding a neutral pitch. */
  neutralLift: number;
  /** Lift force applied when the bird pitches downward into a dive. */
  diveLift: number;
  /** Lift force applied at maximum climb angle. */
  maxClimbLift: number;
  /** Constant gravitational force applied every frame. */
  gravity: number;
}

/**
 * Current flight physics settings tuned to allow forward dives while
 * maintaining enough lift authority for climbs.
 */
export const FLIGHT_PROFILE: FlightProfile = {
  neutralLift: 1.5,
  diveLift: 2.7,
  maxClimbLift: 3.7,
  gravity: 1.5,
};

/**
 * Helper describing the resulting net lift for each key attitude so that the
 * tuning remains self-documenting.
 */
export const NET_LIFT_SUMMARY = {
  neutral: FLIGHT_PROFILE.neutralLift - FLIGHT_PROFILE.gravity,
  dive: FLIGHT_PROFILE.diveLift - FLIGHT_PROFILE.gravity,
  maxClimb: FLIGHT_PROFILE.maxClimbLift - FLIGHT_PROFILE.gravity,
};
