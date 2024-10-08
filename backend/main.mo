import Hash "mo:base/Hash";
import Int "mo:base/Int";

import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor {
    // Types
    type Asset = {
        id: Nat;
        name: Text;
    };

    type Reservation = {
        id: Nat;
        assetId: Nat;
        userId: Principal;
        startTime: Time.Time;
        endTime: Time.Time;
    };

    // State
    stable var nextAssetId: Nat = 0;
    stable var nextReservationId: Nat = 0;
    let assets = HashMap.HashMap<Nat, Asset>(10, Nat.equal, Hash.hash);
    let reservations = HashMap.HashMap<Nat, Reservation>(10, Nat.equal, Hash.hash);

    // Helper functions
    func assetToJson(asset: Asset): Text {
        "{ \"id\": " # Nat.toText(asset.id) # ", \"name\": \"" # asset.name # "\" }"
    };

    func reservationToJson(reservation: Reservation): Text {
        "{ \"id\": " # Nat.toText(reservation.id) #
        ", \"assetId\": " # Nat.toText(reservation.assetId) #
        ", \"userId\": \"" # Principal.toText(reservation.userId) # "\"" #
        ", \"startTime\": " # Int.toText(reservation.startTime) #
        ", \"endTime\": " # Int.toText(reservation.endTime) # " }"
    };

    // Public functions
    public query func getAssets(): async Text {
        let assetArray = Iter.toArray(assets.vals());
        let jsonArray = Array.map(assetArray, assetToJson);
        "[" # Text.join(",", jsonArray.vals()) # "]"
    };

    public query func getReservations(): async Text {
        let reservationArray = Iter.toArray(reservations.vals());
        let jsonArray = Array.map(reservationArray, reservationToJson);
        "[" # Text.join(",", jsonArray.vals()) # "]"
    };

    public func addAsset(name: Text): async Nat {
        let id = nextAssetId;
        nextAssetId += 1;
        let newAsset: Asset = { id = id; name = name };
        assets.put(id, newAsset);
        id
    };

    public shared(msg) func reserveAsset(assetId: Nat, startTime: Int, endTime: Int): async Result.Result<Nat, Text> {
        switch (assets.get(assetId)) {
            case (null) {
                #err("Asset not found")
            };
            case (?asset) {
                let id = nextReservationId;
                nextReservationId += 1;
                let newReservation: Reservation = {
                    id = id;
                    assetId = assetId;
                    userId = msg.caller;
                    startTime = startTime;
                    endTime = endTime;
                };
                reservations.put(id, newReservation);
                #ok(id)
            };
        }
    };

    public shared(msg) func extendReservation(reservationId: Nat, newEndTime: Int): async Result.Result<(), Text> {
        switch (reservations.get(reservationId)) {
            case (null) {
                #err("Reservation not found")
            };
            case (?reservation) {
                if (reservation.userId != msg.caller) {
                    #err("You can only extend your own reservations")
                } else {
                    let updatedReservation: Reservation = {
                        id = reservation.id;
                        assetId = reservation.assetId;
                        userId = reservation.userId;
                        startTime = reservation.startTime;
                        endTime = newEndTime;
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
