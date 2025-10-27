import { SprintProvider } from "@/features/sprint/context";
import { PlayContent } from "./Play";

export default function OldPlay() {
  return (
    <SprintProvider>
      <PlayContent variant="classic" />
    </SprintProvider>
  );
}
