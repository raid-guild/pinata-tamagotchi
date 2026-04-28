import PetScene from "@/app/components/PetScene";
import { getSnapshot } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

export default function Home() {
  return <PetScene initialSnapshot={getSnapshot()} />;
}
