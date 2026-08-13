import React from 'react';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';

export const ProjectWorkflowPage: React.FC = () => {
  return (
    <div className="h-full w-full overflow-hidden">
      <WorkflowCanvas />
    </div>
  );
};
