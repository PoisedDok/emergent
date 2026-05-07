import React from 'react';

import { STATUS_COLORS } from '../../helpers/constants';

import { formatNumber } from '../../helpers/helpers';

import Card from '../ui/Card';

import Line from '../ui/Line';

interface StatsCardProps {
    total: number;
    lineData: unknown[];
    title: object;
    color: string;
    percent?: number;
    onClick?: () => void;
}

const StatsCard = ({ total, lineData, percent, title, color, onClick }: StatsCardProps) => {
    return (
        <div
            className={onClick ? 'cursor-pointer hover-scale stats-card-interactive' : ''}
            onClick={onClick}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <Card type="card--full" bodyType="card-wrap">
                <div className="card-body-stats">
                    <div className={`card-value card-value-stats text-${color}`}>{formatNumber(total)}</div>

                    <div className="card-title-stats" onClick={(e) => { e.stopPropagation(); }}>{title}</div>
                </div>
                {percent >= 0 && <div className={`card-value card-value-percent text-${color}`}>{percent}</div>}

                <div className="card-chart-bg">
                    <Line data={lineData} color={STATUS_COLORS[color]} />
                </div>
            </Card>
        </div>
    );
};

export default StatsCard;
