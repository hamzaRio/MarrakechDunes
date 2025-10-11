export var PaymentType;
(function (PaymentType) {
    PaymentType["CASH"] = "CASH";
    PaymentType["DEPOSIT"] = "DEPOSIT";
    PaymentType["TRANSFER"] = "TRANSFER";
    PaymentType["CARD"] = "CARD";
    PaymentType["OTHER"] = "OTHER";
})(PaymentType || (PaymentType = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["UNPAID"] = "UNPAID";
    PaymentStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PaymentStatus["DEPOSIT_PAID"] = "DEPOSIT_PAID";
    PaymentStatus["FULLY_PAID"] = "FULLY_PAID";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
})(PaymentStatus || (PaymentStatus = {}));
