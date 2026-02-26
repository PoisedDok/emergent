import React, { memo } from 'react';

type Props = {
    className?: string;
};

    export const Logo = memo(({ className }: Props) => {
        return (
            <svg 
                className={className} 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ height: '32px', width: '32px', flexShrink: 0 }}
            >
                <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" fill="rgba(26, 115, 232, 0.15)" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 11.5L11 14L15.5 9" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );
    });

Logo.displayName = 'Logo';
