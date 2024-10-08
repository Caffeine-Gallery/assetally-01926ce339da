import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type TimePeriod = { 'OneHour' : null } |
  { 'OneDay' : null } |
  { 'EightHours' : null };
export interface _SERVICE {
  'addAsset' : ActorMethod<[string], bigint>,
  'cancelReservation' : ActorMethod<[bigint], Result_1>,
  'extendReservation' : ActorMethod<[bigint], Result_1>,
  'getAssets' : ActorMethod<[], string>,
  'getReservations' : ActorMethod<[], string>,
  'reserveAsset' : ActorMethod<[bigint, TimePeriod], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
