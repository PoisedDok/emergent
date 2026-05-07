import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import Line from '../ui/Line';
import { STATUS_COLORS, DAY } from '../../helpers/constants';
import { formatNumber, normalizeHistory } from '../../helpers/helpers';
import apiClient from '../../api/Api';

interface StatsModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    title: React.ReactNode;
    color: string;
    defaultTotal: number;
    defaultLineData: any[];
    metricId: string;
    globalInterval: number;
}

const PERIOD_MS: Record<string, number> = {
    '24h': DAY,
    '7d': DAY * 7,
    '30d': DAY * 30,
    '90d': DAY * 90,
};

const METRIC_API_KEYS: Record<string, { array: string, num: string }> = {
    'dnsQuery': { array: 'dns_queries', num: 'num_dns_queries' },
    'blockedFiltering': { array: 'blocked_filtering', num: 'num_blocked_filtering' },
    'replacedSafebrowsing': { array: 'replaced_safebrowsing', num: 'num_replaced_safebrowsing' },
    'replacedParental': { array: 'replaced_parental', num: 'num_replaced_parental' },
};

const StatsModal = ({ isOpen, onRequestClose, title, color, defaultTotal, defaultLineData, metricId, globalInterval }: StatsModalProps) => {
    const getDefaultPeriod = () => {
        if (globalInterval === PERIOD_MS['90d']) return '90d';
        if (globalInterval === PERIOD_MS['30d']) return '30d';
        if (globalInterval === PERIOD_MS['7d']) return '7d';
        return '24h';
    };

    const [period, setPeriod] = useState(getDefaultPeriod());
    const [isLoading, setIsLoading] = useState(false);
    const [customTotal, setCustomTotal] = useState<number | null>(null);
    const [customLineData, setCustomLineData] = useState<any[] | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPeriod(getDefaultPeriod());
            setCustomTotal(null);
            setCustomLineData(null);
        }
    }, [isOpen, globalInterval]);

    useEffect(() => {
        if (!isOpen || !metricId) return;

        const ms = PERIOD_MS[period];
        
        if (ms === globalInterval) {
            setCustomTotal(null);
            setCustomLineData(null);
            return;
        }

        let isMounted = true;
        
        const fetchCustomData = async () => {
            setIsLoading(true);
            try {
                const stats = await apiClient.getStats({ recent: ms });
                if (!isMounted) return;
                
                const keys = METRIC_API_KEYS[metricId];
                if (keys && stats[keys.num] !== undefined) {
                    setCustomTotal(stats[keys.num]);
                    setCustomLineData([{ data: normalizeHistory(stats[keys.array]), id: metricId }]);
                }
            } catch (error) {
                // Ignore API errors on background fetch
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchCustomData();

        return () => { isMounted = false; };
    }, [period, isOpen, metricId, globalInterval]);

    const activeTotal = customTotal !== null ? customTotal : defaultTotal;
    const activeLineData = customLineData !== null ? customLineData : defaultLineData;

    return (
        <ReactModal
            className="Modal__Bootstrap modal-dialog modal-dialog-centered modal-dialog--stats"
            closeTimeoutMS={0}
            isOpen={isOpen}
            onRequestClose={onRequestClose}>
            <div className="modal-content" style={{ minWidth: '600px', minHeight: '450px' }}>
                <div className="modal-header d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="modal-title mb-1">{title}</h4>
                        <div className={`h2 mb-0 text-${color}`}>
                            {isLoading ? '...' : formatNumber(activeTotal)}
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <div className="btn-group btn-group-sm mr-3">
                            {Object.keys(PERIOD_MS).map(key => {
                                return (
                                    <button 
                                        key={key}
                                        className={`btn ${period === key ? 'btn-primary' : 'btn-outline-primary'}`} 
                                        onClick={() => setPeriod(key)}
                                        title={PERIOD_MS[key] > globalInterval ? "May not have full data due to your global retention settings" : ""}
                                    >
                                        {key}
                                    </button>
                                );
                            })}
                        </div>
                        <button type="button" className="close m-0 p-0" onClick={onRequestClose}>
                            <span className="sr-only">Close</span>
                        </button>
                    </div>
                </div>
                <div className="modal-body p-0" style={{ height: '350px', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <Line data={activeLineData} color={STATUS_COLORS[color]} showAxes={true} />
                </div>
            </div>
        </ReactModal>
    );
};

export default StatsModal;
