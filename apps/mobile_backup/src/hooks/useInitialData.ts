import { useEffect } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { useFeedStore } from '../store/useFeedStore';
import { usePropStore } from '../store/usePropStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useAuthStore } from '../store/useAuthStore';

/**
 * useInitialData Hook
 * 
 * Centralized point to trigger all initial data fetches
 * once the user is authenticated.
 */
export const useInitialData = () => {
    const { token } = useAuthStore();
    const fetchMarket = useMarketStore(s => s.fetchInitialData);
    const fetchFeed = useFeedStore(s => s.fetchInitialData);
    const fetchProp = usePropStore(s => s.fetchInitialData);
    const fetchPortfolio = usePortfolioStore(s => s.fetchInitialData);

    useEffect(() => {
        if (token) {
            console.log('🚀 Authenticated. Fetching initial data...');
            fetchMarket();
            fetchFeed();
            fetchProp();
            fetchPortfolio();
        }
    }, [token, fetchMarket, fetchFeed, fetchProp, fetchPortfolio]);
};
