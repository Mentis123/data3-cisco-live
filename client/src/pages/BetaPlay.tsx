import { SprintProvider } from "@/features/sprint/context";
import { PlayContent } from "./Play";

export default function BetaPlay() {
  return (
    <SprintProvider>
      <PlayContent variant="beta" />
    </SprintProvider>
  );
}
