import Bool "mo:base/Bool";

import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Hash "mo:base/Hash";

actor {
    // Types
    type Asset = {
        id: Nat;
        name: Text;
    };

    type TimePeriod = {
        #OneHour;
        #EightHours;
        #OneDay;
    };

    type Reservation = {
        id: Nat;
        assetId: Nat;
        userId: Principal;
        startTime: Time.Time;
        endTime: Time.Time;
        period: TimePeriod;
    };

    // Stable storage
    stable var nextAssetId: Nat = 0;
    stable var nextReservationId: Nat = 0;
    stable var stableAssets: [(Nat, Asset)] = [];
    stable var stableReservations: [(Nat, Reservation)] = [];

    // Runtime storage
    var assets = HashMap.fromIter<Nat, Asset>(stableAssets.vals(), 10, Nat.equal, Hash.hash);
    var reservations = HashMap.fromIter<Nat, Reservation>(stableReservations.vals(), 10, Nat.equal, Hash.hash);

    // Upgrade hooks
    system func preupgrade() {
        stableAssets := Iter.toArray(assets.entries());
        stableReservations := Iter.toArray(reservations.entries());
    };

    system func postupgrade() {
        assets := HashMap.fromIter<Nat, Asset>(stableAssets.vals(), 10, Nat.equal, Hash.hash);
        reservations := HashMap.fromIter<Nat, Reservation>(stableReservations.vals(), 10, Nat.equal, Hash.hash);
    };

    // Helper functions
    func assetToJson(asset: Asset): Text {
        "{ \"id\": " # Nat.toText(asset.id) # ", \"name\": \"" # asset.name # "\" }"
    };

    func timePeriodToJson(period: TimePeriod): Text {
        switch (period) {
            case (#OneHour) "\"OneHour\"";
            case (#EightHours) "\"EightHours\"";
            case (#OneDay) "\"OneDay\"";
        }
    };

    func reservationToJson(reservation: Reservation): Text {
        "{ \"id\": " # Nat.toText(reservation.id) #
        ", \"assetId\": " # Nat.toText(reservation.assetId) #
        ", \"userId\": \"" # Principal.toText(reservation.userId) # "\"" #
        ", \"startTime\": " # Int.toText(reservation.startTime) #
        ", \"endTime\": " # Int.toText(reservation.endTime) #
        ", \"period\": " # timePeriodToJson(reservation.period) # " }"
    };

    func calculateEndTime(startTime: Time.Time, period: TimePeriod): Time.Time {
        switch (period) {
            case (#OneHour) startTime + 3600_000_000_000;
            case (#EightHours) startTime + 28800_000_000_000;
            case (#OneDay) startTime + 86400_000_000_000;
        }
    };

    func isAssetReserved(assetId: Nat): Bool {
        let currentTime = Time.now();
        for (reservation in reservations.vals()) {
            if (reservation.assetId == assetId and reservation.endTime > currentTime) {
                return true;
            };
        };
        false
    };

    func getAssetReservationStatus(assetId: Nat): ?Reservation {
        let currentTime = Time.now();
        for (reservation in reservations.vals()) {
            if (reservation.assetId == assetId and reservation.endTime > currentTime) {
                return ?reservation;
            };
        };
        null
    };

    // Public functions
    public query func getAssets(): async Text {
        let assetArray = Iter.toArray(assets.vals());
        let jsonArray = Array.map(assetArray, func (asset: Asset): Text {
            let reservationStatus = getAssetReservationStatus(asset.id);
            let statusJson = switch (reservationStatus) {
                case (null) "null";
                case (?reservation) reservationToJson(reservation);
            };
            "{ \"id\": " # Nat.toText(asset.id) # 
            ", \"name\": \"" # asset.name # "\"" #
            ", \"reservationStatus\": " # statusJson # " }"
        });
        "[" # Text.join(",", jsonArray.vals()) # "]"
    };

    public query func getReservations(): async Text {
        let reservationArray = Iter.toArray(reservations.vals());
        let jsonArray = Array.map(reservationArray, reservationToJson);
        "[" # Text.join(",", jsonArray.vals()) # "]"
    };

    public query func getUserReservations(userId: Principal): async Text {
        let userReservations = Array.filter(Iter.toArray(reservations.vals()), func (r: Reservation): Bool { r.userId == userId });
        let jsonArray = Array.map(userReservations, reservationToJson);
        "[" # Text.join(",", jsonArray.vals()) # "]"
    };

    public func addAsset(name: Text): async Nat {
        let id = nextAssetId;
        nextAssetId += 1;
        let newAsset: Asset = { id = id; name = name };
        assets.put(id, newAsset);
        id
    };

    public func removeAsset(id: Nat): async Result.Result<(), Text> {
        if (isAssetReserved(id)) {
            #err("Cannot remove asset. It is currently reserved.")
        } else {
            assets.delete(id);
            #ok()
        }
    };

    public shared(msg) func reserveAsset(assetId: Nat, period: TimePeriod): async Result.Result<Nat, Text> {
        switch (assets.get(assetId)) {
            case (null) {
                #err("Asset not found")
            };
            case (?asset) {
                if (isAssetReserved(assetId)) {
                    #err("Asset is already reserved")
                } else {
                    let id = nextReservationId;
                    nextReservationId += 1;
                    let startTime = Time.now();
                    let endTime = calculateEndTime(startTime, period);
                    let newReservation: Reservation = {
                        id = id;
                        assetId = assetId;
                        userId = msg.caller;
                        startTime = startTime;
                        endTime = endTime;
                        period = period;
                    };
                    reservations.put(id, newReservation);
                    #ok(id)
                }
            };
        }
    };

    public shared(msg) func extendReservation(reservationId: Nat): async Result.Result<(), Text> {
        switch (reservations.get(reservationId)) {
            case (null) {
                #err("Reservation not found")
            };
            case (?reservation) {
                if (reservation.userId != msg.caller) {
                    #err("You can only extend your own reservations")
                } else {
                    let newEndTime = calculateEndTime(reservation.endTime, reservation.period);
                    let updatedReservation: Reservation = {
                        id = reservation.id;
                        assetId = reservation.assetId;
                        userId = reservation.userId;
                        startTime = reservation.startTime;
                        endTime = newEndTime;
                        period = reservation.period;
                    };
                    reservations.put(reservationId, updatedReservation);
                    #ok()
                }
            };
        }
    };

    public shared(msg) func cancelReservation(reservationId: Nat): async Result.Result<(), Text> {
        switch (reservations.get(reservationId)) {
            case (null) {
                #err("Reservation not found")
            };
            case (?reservation) {
                if (reservation.userId != msg.caller) {
                    #err("You can only cancel your own reservations")
                } else {
                    reservations.delete(reservationId);
                    #ok()
                }
            };
        }
    };
};
