'use client';

import React from 'react';
import type { AssignmentModalsProps } from './types';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { EditAssignmentModal } from './EditAssignmentModal';
import { SubmissionsModal } from './SubmissionsModal';
import { GradeModal } from './GradeModal';

export type { AssignmentModalsProps };
export type { Class, Assignment, Submission } from './types';

export function AssignmentModals(props: AssignmentModalsProps) {
  return (
    <>
      <CreateAssignmentModal {...props} />
      <EditAssignmentModal {...props} />
      <SubmissionsModal {...props} />
      <GradeModal {...props} />
    </>
  );
}
