import { SprintProvider } from "@/features/sprint/context";
import { PlayContent } from "./Play";

export default function RingPlay() {
  return (
    <SprintProvider>
      <PlayContent variant="ring" />
    </SprintProvider>
  );
}
