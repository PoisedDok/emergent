import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import { withTranslation, Trans } from 'react-i18next';

import StatsCard from './StatsCard';
import StatsModal from './StatsModal';

import { getPercent, normalizeHistory } from '../../helpers/helpers';
import { RESPONSE_FILTER } from '../../helpers/constants';

const getNormalizedHistory = (data: any, interval: any, id: any) => [{ data: normalizeHistory(data), id }];

interface StatisticsProps {
    interval: number;
    dnsQueries: number[];
    blockedFiltering: unknown[];
    replacedSafebrowsing: unknown[];
    replacedParental: unknown[];
    numDnsQueries: number;
    numBlockedFiltering: number;
    numReplacedSafebrowsing: number;
    numReplacedParental: number;
    refreshButton: React.ReactNode;
}

const Statistics = ({
    interval,
    dnsQueries,
    blockedFiltering,
    replacedSafebrowsing,
    replacedParental,
    numDnsQueries,
    numBlockedFiltering,
    numReplacedSafebrowsing,
    numReplacedParental,
}: StatisticsProps) => {
    const [activeModal, setActiveModal] = useState<any>(null);

    const closeModal = () => setActiveModal(null);

    // Re-calculate the active modal data on re-render to keep it live
    const currentActiveModalData = React.useMemo(() => {
        if (!activeModal) return null;

        switch (activeModal.id) {
            case 'dnsQuery':
                return {
                    ...activeModal,
                    total: numDnsQueries,
                    lineData: getNormalizedHistory(dnsQueries, interval, 'dnsQuery'),
                };
            case 'blockedFiltering':
                return {
                    ...activeModal,
                    total: numBlockedFiltering,
                    lineData: getNormalizedHistory(blockedFiltering, interval, 'blockedFiltering'),
                };
            case 'replacedSafebrowsing':
                return {
                    ...activeModal,
                    total: numReplacedSafebrowsing,
                    lineData: getNormalizedHistory(replacedSafebrowsing, interval, 'replacedSafebrowsing'),
                };
            case 'replacedParental':
                return {
                    ...activeModal,
                    total: numReplacedParental,
                    lineData: getNormalizedHistory(replacedParental, interval, 'replacedParental'),
                };
            default:
                return activeModal;
        }
    }, [
        activeModal,
        numDnsQueries, dnsQueries,
        numBlockedFiltering, blockedFiltering,
        numReplacedSafebrowsing, replacedSafebrowsing,
        numReplacedParental, replacedParental,
        interval
    ]);

    return (
        <div className="row">
            <div className="col-sm-6 col-lg-3">
                <StatsCard
                    total={numDnsQueries}
                    lineData={getNormalizedHistory(dnsQueries, interval, 'dnsQuery')}
                    title={
                        <Link to="logs">
                            <Trans>dns_query</Trans>
                        </Link>
                    }
                    color="blue"
                    onClick={() => setActiveModal({ id: 'dnsQuery', title: <Trans>dns_query</Trans>, color: 'blue' })}
                />
            </div>

            <div className="col-sm-6 col-lg-3">
                <StatsCard
                    total={numBlockedFiltering}
                    lineData={getNormalizedHistory(blockedFiltering, interval, 'blockedFiltering')}
                    percent={getPercent(numDnsQueries, numBlockedFiltering)}
                    title={
                        <Trans
                            components={[
                                <Link to={`logs?response_status=${RESPONSE_FILTER.BLOCKED.QUERY}`} key="0">
                                    link
                                </Link>,
                            ]}>
                            blocked_by
                        </Trans>
                    }
                    color="red"
                    onClick={() => setActiveModal({ id: 'blockedFiltering', title: <Trans>blocked_by</Trans>, color: 'red' })}
                />
            </div>

            <div className="col-sm-6 col-lg-3">
                <StatsCard
                    total={numReplacedSafebrowsing}
                    lineData={getNormalizedHistory(replacedSafebrowsing, interval, 'replacedSafebrowsing')}
                    percent={getPercent(numDnsQueries, numReplacedSafebrowsing)}
                    title={
                        <Link to={`logs?response_status=${RESPONSE_FILTER.BLOCKED_THREATS.QUERY}`}>
                            <Trans>stats_malware_phishing</Trans>
                        </Link>
                    }
                    color="green"
                    onClick={() => setActiveModal({ id: 'replacedSafebrowsing', title: <Trans>stats_malware_phishing</Trans>, color: 'green' })}
                />
            </div>

            <div className="col-sm-6 col-lg-3">
                <StatsCard
                    total={numReplacedParental}
                    lineData={getNormalizedHistory(replacedParental, interval, 'replacedParental')}
                    percent={getPercent(numDnsQueries, numReplacedParental)}
                    title={
                        <Link to={`logs?response_status=${RESPONSE_FILTER.BLOCKED_ADULT_WEBSITES.QUERY}`}>
                            <Trans>stats_adult</Trans>
                        </Link>
                    }
                    color="yellow"
                    onClick={() => setActiveModal({ id: 'replacedParental', title: <Trans>stats_adult</Trans>, color: 'yellow' })}
                />
            </div>

            <StatsModal
                isOpen={!!currentActiveModalData}
                onRequestClose={closeModal}
                title={currentActiveModalData?.title}
                color={currentActiveModalData?.color || 'blue'}
                defaultTotal={currentActiveModalData?.total || 0}
                defaultLineData={currentActiveModalData?.lineData || []}
                metricId={currentActiveModalData?.id || ''}
                globalInterval={interval}
            />
        </div>
    );
};

export default withTranslation()(Statistics);
