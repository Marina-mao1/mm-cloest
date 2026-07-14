import { useEffect, useState } from "react";
import entranceImage from "../assets/mm-closet-entrance.jpg";

type Props = {
  onBeginEnter: () => void;
  onCompleteEnter: () => void;
};

export function EntrancePage({ onBeginEnter, onCompleteEnter }: Props) {
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(onCompleteEnter, 1800);
    return () => window.clearTimeout(timer);
  }, [onCompleteEnter, opening]);

  const openCloset = () => {
    if (opening) return;
    setOpening(true);
    onBeginEnter();
  };

  return (
    <main className={`entrance-screen ${opening ? "is-dissolving" : ""}`}>
      <img className="entrance-photo" src={entranceImage} alt="A warm pink bedroom wardrobe" />
      <button className="entrance-enter-hit" onClick={openCloset} aria-label="Enter my closet" disabled={opening} />
    </main>
  );
}
