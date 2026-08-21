import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import useStudio from '../hooks/useStudio';
import usePublish from '../hooks/usePublish';
import StudioShell from '../components/studio/StudioShell';

export const StudioPage: React.FC = () => {
  const currentUser = useSelector(selectUser);
  const studio = useStudio(currentUser);
  const { publish, isPublishing, error: validationError, success: publishSuccess } = usePublish();

  const handlePublish = async () => {
    await publish({
      userId: currentUser?.id,
      templateDef: studio.activeTemplateDef,
      creator: studio.creator,
      blocks: studio.blocks,
      theme: studio.resolvedTheme,
    });
  };

  return (
    <StudioShell
      templateDef={studio.activeTemplateDef}
      selectedSlug={studio.templateSlug}
      onSelectTemplate={studio.handleTemplateSelect}
      device={studio.device}
      onDeviceChange={studio.setDevice}
      creator={studio.creator}
      blocks={studio.blocks}
      theme={studio.resolvedTheme}
      activeSection={studio.activeSection}
      onSectionClick={studio.handleSectionClick}
      onThemeChange={studio.handleThemeChange}
      onCreatorChange={studio.handleCreatorChange}
      onBlockAdd={studio.handleBlockAdd}
      onBlockUpdate={studio.handleBlockUpdate}
      onBlockRemove={studio.handleBlockRemove}
      onBlockReorder={studio.handleBlockReorder}
      isPublishing={isPublishing}
      publishSuccess={publishSuccess}
      validationError={validationError}
      onPublish={handlePublish}
    />
  );
};

export default StudioPage;
