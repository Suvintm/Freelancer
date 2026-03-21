import React, { useState, useEffect, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ENRICHED_STORY_DATA } from "../utils/storiesData";
import StoryViewer from "../components/StoryViewer";

/**
 * StoriesPage - Dedicated route for viewing stories.
 * URL: /stories/:userId
 */
const StoriesPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // Find initial user index based on ID
  const initialUserIndex = ENRICHED_STORY_DATA.findIndex(u => u.id === String(userId));
  
  // If user not found, default to first user or redirect
  const [activeUserIdx, setActiveUserIdx] = useState(initialUserIndex >= 0 ? initialUserIndex : 0);

  // Sync index if URL changes (e.g., deep linking or navigation)
  useEffect(() => {
    if (userId) {
      const idx = ENRICHED_STORY_DATA.findIndex(u => u.id === String(userId));
      if (idx >= 0) setActiveUserIdx(idx);
    }
  }, [userId]);

  return (
    <div className="bg-black w-full h-screen">
      {/* 
        We use the existing StoryViewer component but as a Page-level container.
        Since StoryViewer is already highly optimized, we just wrap it.
      */}
      <StoryViewer 
        isOpen={true}
        initialUserIndex={activeUserIdx}
        users={ENRICHED_STORY_DATA}
        onClose={() => navigate(-1)} // Navigate back to where they came from
      />
    </div>
  );
};

export default StoriesPage;
