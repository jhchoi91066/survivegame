import { GameType } from './types';
import {
    Grid2X2,
    Calculator,
    Brain,
    Palette,
    LucideIcon
} from 'lucide-react-native';

export interface GameConfig {
    id: GameType;
    name: string;
    description: string;
    icon: LucideIcon;
    route: string;
    gradientKey: 'flipMatch' | 'mathRush' | 'spatialMemory' | 'stroop';
}

export const GAMES: GameConfig[] = [
    {
        id: 'flip_match',
        name: 'Flip & Match',
        description: '카드 뒤집기',
        icon: Grid2X2,
        route: 'FlipMatchGame',
        gradientKey: 'flipMatch',
    },
    {
        id: 'math_rush',
        name: 'Math Rush',
        description: '빠른 계산',
        icon: Calculator,
        route: 'MathRushGame',
        gradientKey: 'mathRush',
    },
    {
        id: 'spatial_memory',
        name: 'Spatial Memory',
        description: '공간 기억',
        icon: Brain,
        route: 'SpatialMemoryGame',
        gradientKey: 'spatialMemory',
    },
    {
        id: 'stroop',
        name: 'Stroop Test',
        description: '색상-단어',
        icon: Palette,
        route: 'StroopTestGame',
        gradientKey: 'stroop',
    },
];
