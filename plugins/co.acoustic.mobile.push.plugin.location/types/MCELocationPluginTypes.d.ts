/**
The location callback includes no data. When it is received you should refresh your inbox database.
@typedef LocationCallback
*/
export declare type LocationCallback = VoidFunction;
export declare type LocationAuthorizationCallback = (level: -2 | -1 | 0 | 1) => void;
