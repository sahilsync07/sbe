import { config } from '@vue/test-utils';

// Mock Capacitor for tests
config.global.mocks = {
    $route: {
        path: '/',
        params: {}
    },
    $router: {
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn()
    }
};

// Global test utilities
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};
