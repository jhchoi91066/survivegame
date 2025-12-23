export type RootStackParamList = {
    MainTabs: undefined;
    Login: undefined;
    Settings: undefined;
    FriendComparison: { friendId: string; friendUsername: string; };
    MultiplayerGame: { roomId: string; gameType: string; difficulty?: string; isCreator?: boolean; };
    FlipMatchGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
    MathRushGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
    SpatialMemoryGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
    StroopTestGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
};
