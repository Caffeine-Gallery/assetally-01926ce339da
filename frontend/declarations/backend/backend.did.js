export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const TimePeriod = IDL.Variant({
    'OneHour' : IDL.Null,
    'OneDay' : IDL.Null,
    'EightHours' : IDL.Null,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  return IDL.Service({
    'addAsset' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'cancelReservation' : IDL.Func([IDL.Nat], [Result_1], []),
    'extendReservation' : IDL.Func([IDL.Nat], [Result_1], []),
    'getAssets' : IDL.Func([], [IDL.Text], ['query']),
    'getReservations' : IDL.Func([], [IDL.Text], ['query']),
    'reserveAsset' : IDL.Func([IDL.Nat, TimePeriod], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
