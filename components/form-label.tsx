import React from 'react';

interface FormLabelProps {
    htmlFor: string;
    children: React.ReactNode;
    isRequired?: boolean;
    className?: string;
}

export const FormLabel: React.FC<FormLabelProps> = ({
    htmlFor,
    children,
    isRequired = false,
    className = "block text-base  mb-2"
}) => {
    return (
        <label className={className} htmlFor={htmlFor}>
            {children}
            {isRequired && <span className="text-red-500">*</span>}
        </label>
    );
};
