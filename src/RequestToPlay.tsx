import { RequestToPlayForm } from "@components/requestToPlayForm";
import { useGameLoaded } from "@context/hooks";

export default function RequestToPlay() {
  const isLoaded = useGameLoaded();

  return <>{isLoaded ? <RequestToPlayForm /> : <div>Loading...</div>}</>;
}
