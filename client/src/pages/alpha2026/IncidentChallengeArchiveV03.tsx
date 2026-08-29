import IncidentChallengeV03 from "./IncidentChallengeV03";
import { incidents, responseProfiles } from "./incident-v03-data";

export default function IncidentChallengeArchiveV03() {
  return (
    <IncidentChallengeV03
      incidentSet={incidents}
      profiles={responseProfiles}
      archiveMode
      versionLabel="v0.3"
    />
  );
}
