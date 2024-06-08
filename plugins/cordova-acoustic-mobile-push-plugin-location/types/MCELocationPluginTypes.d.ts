/**
The location callback includes no data. When it is received you should refresh your inbox database.
@typedef LocationCallback
*/
export type LocationCallback = VoidFunction;
export type LocationAuthorizationCallback = (level: -2 | -1 | 0 | 1) => void;
