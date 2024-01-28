const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: "EMAIL_IS_NOT_VALID",
      },
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "notary", "admin", "witness"],
      default: "customer",
    },
    approve: {
      type: String,
      enum: ["active", "inactive"],
    },
    verification: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    temporary: {
      type: Boolean,
      default: false,
    },
    realEmail: {
      type: String,
    },
    witnessid: {
      type: Object,
    },
    testingacc: {
      type: Boolean,
      default: false,
    },
    first_name: {
      required: false,
      type: String,
    },
    last_name: {
      required: false,
      type: String,
    },
    name: {
      required: false,
      type: String,
    },
    phone: {
      required: false,
      type: String,
    },
    commissionNumber: {
      required: false,
      type: String,
    },
    state: {
      required: false,
      type: String,
    },
    city: {
      required: false,
      type: String,
    },
    country: {
      required: false,
      type: String,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    blockExpires: {
      type: Date,
      default: Date.now,
      select: false,
    },
    stripeCustomerID: String,
    stripeSubscriptionID: String,
    planID: String,
    billDate: Number,
    promoCode: {
      type: String,
    },
    memberType:  {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    isCommissionExpired: {
      type: Boolean,
      default: false,
    },
    totalWitnessLimit: {
      type: Boolean,
      default: false,
    },
    turnOffPdfSession: {
      type: Boolean,
      default: false,
    },
    emailLogoName: {
      type: String,
    },
    emailLogoUrl: {
      type: String,
    },
    emailLogoKey: {
      type: String,
    },
    emailCustomMessage: {
      type: String,
    },
    sendBrandEmails: {
      type: Boolean,
      default: false,
    },
    notaryCustomCharges: {
      type: Object,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

const hash = (user, salt, next) => {
  bcrypt.hash(user.password, salt, null, (error, newHash) => {
    if (error) {
      return next(error);
    }
    user.password = newHash;
    return next();
  });
};

const genSalt = (user, SALT_FACTOR, next) => {
  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    if (err) {
      return next(err);
    }
    return hash(user, salt, next);
  });
};

UserSchema.pre("save", function(next) {
  const that = this;
  const SALT_FACTOR = 5;
  if (!that.isModified("password")) {
    return next();
  }
  return genSalt(that, SALT_FACTOR, next);
});

UserSchema.methods.comparePassword = function(passwordAttempt, cb) {
  bcrypt.compare(passwordAttempt, this.password, (err, isMatch) =>
    err ? cb(err) : cb(null, isMatch),
  );
};
UserSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("User", UserSchema);
