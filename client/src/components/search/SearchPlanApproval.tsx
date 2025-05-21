// src/components/search/SearchPlanApproval.tsx
import { Button, Textarea } from '@rewind-ui/core';
import React, { useState } from 'react';
import { StepData } from '../../types/search';

interface SearchPlanApprovalProps {
    searchPlan: StepData[];
    onApprove: () => void;
    onEdit: (editedPlan: StepData[]) => void;
}

const SearchPlanApproval: React.FC<SearchPlanApprovalProps> = ({
    searchPlan,
    onApprove,
    onEdit
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState<StepData[]>([...searchPlan]);

    if (!searchPlan || searchPlan.length === 0) return null;

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        // Reset to original plan and exit edit mode
        setEditedPlan([...searchPlan]);
        setIsEditing(false);
    };

    const handleSaveEdit = () => {
        // Filter out any empty steps
        const filteredPlan = editedPlan.filter(step => step.step.trim() !== '');
        onEdit(filteredPlan);
        setIsEditing(false);
    };

    const handleStepTextChange = (index: number, value: string) => {
        const updatedPlan = [...editedPlan];
        updatedPlan[index] = { ...updatedPlan[index], step: value };
        setEditedPlan(updatedPlan);
    };

    const handleStepTypeChange = (index: number, value: 'sequential' | 'parallel') => {
        const updatedPlan = [...editedPlan];
        updatedPlan[index] = { ...updatedPlan[index], stepType: value };
        setEditedPlan(updatedPlan);
    };

    const handleAddStep = () => {
        setEditedPlan([...editedPlan, { step: '', stepType: 'sequential' }]);
    };

    const handleRemoveStep = (index: number) => {
        const updatedPlan = [...editedPlan];
        updatedPlan.splice(index, 1);
        setEditedPlan(updatedPlan);
    };

    // Group steps by type for display
    const groupStepsByType = (steps: StepData[]) => {
        const result: { type: 'sequential' | 'parallel', steps: (StepData & { index: number })[] }[] = [];
        let currentGroup: { type: 'sequential' | 'parallel', steps: (StepData & { index: number })[] } | null = null;

        steps.forEach((step, index) => {
            if (!currentGroup || step.stepType !== currentGroup.type) {
                if (currentGroup) {
                    result.push(currentGroup);
                }
                currentGroup = { type: step.stepType, steps: [] };
            }
            currentGroup.steps.push({ ...step, index });
        });

        if (currentGroup && currentGroup.steps.length > 0) {
            result.push(currentGroup);
        }

        return result;
    };

    const groupedSteps = groupStepsByType(searchPlan);

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4 animate-fade-in">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Proposed Search Plan</h3>
            <p className="text-yellow-700 mb-4">
                {isEditing
                    ? "Edit the search plan to modify how your query will be processed:"
                    : "This query requires multiple steps. Please review and approve the search plan:"}
            </p>

            {!isEditing ? (
                /* View Mode */
                <>
                    <div className="mb-4 space-y-4">
                        {groupedSteps.map((group, groupIndex) => (
                            <div
                                key={groupIndex}
                                className={`p-3 rounded-lg ${group.type === 'parallel'
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-green-50 border border-green-200'
                                    }`}
                            >
                                <h4 className={`text-sm font-semibold mb-2 ${group.type === 'parallel' ? 'text-blue-700' : 'text-green-700'
                                    }`}>
                                    {group.type === 'parallel' ? 'Parallel Steps' : 'Sequential Step'}
                                </h4>
                                <ul className="list-decimal pl-5 space-y-2">
                                    {group.steps.map((stepData) => (
                                        <li
                                            key={stepData.index}
                                            className={group.type === 'parallel' ? 'text-blue-700' : 'text-green-700'}
                                        >
                                            {stepData.step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-3">
                        <Button color="yellow" onClick={onApprove}>
                            Approve and Continue
                        </Button>
                        <Button color="gray" onClick={handleEditClick}>
                            Edit Plan
                        </Button>
                    </div>
                </>
            ) : (
                /* Edit Mode */
                <>
                    <div className="mb-4 space-y-3">
                        {editedPlan.map((stepData, index) => (
                            <div key={index} className="flex items-start space-x-2">
                                <div className="min-w-[24px] h-6 flex items-center justify-center bg-yellow-100 rounded text-yellow-800 font-medium text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-grow space-y-2">
                                    <Textarea
                                        value={stepData.step}
                                        onChange={(e) => handleStepTextChange(index, e.target.value)}
                                        className="w-full bg-white border-yellow-300 focus:border-yellow-500"
                                        rows={2}
                                    />
                                    <select
                                        value={stepData.stepType}
                                        onChange={(e) => handleStepTypeChange(index, e.target.value as 'sequential' | 'parallel')}
                                        className="w-full p-2 border border-yellow-300 rounded-md focus:border-yellow-500 focus:ring-yellow-500 bg-white text-sm"
                                    >
                                        <option value="sequential">Sequential</option>
                                        <option value="parallel">Parallel</option>
                                    </select>
                                </div>
                                <Button
                                    color="red"
                                    size="xs"
                                    onClick={() => handleRemoveStep(index)}
                                    className="mt-1"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap space-x-3 space-y-3 sm:space-y-0">
                        <Button color="blue" onClick={handleAddStep}>
                            + Add Step
                        </Button>
                        <Button color="green" onClick={handleSaveEdit}>
                            Save Changes
                        </Button>
                        <Button color="gray" onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SearchPlanApproval;