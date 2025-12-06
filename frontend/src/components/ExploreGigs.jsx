import { FaGift } from "react-icons/fa";
import EmptyState from "./EmptyState.jsx";

const ExploreGigs = () => {
  return (
    <EmptyState
      icon={FaGift}
      title="Gigs Coming Soon!"
      description="The gigs marketplace is under development. Soon editors will be able to create and showcase their service packages here."
    />
  );
};

export default ExploreGigs;
