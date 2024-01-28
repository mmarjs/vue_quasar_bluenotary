import mongoose, { Schema } from 'mongoose'
import { INEWSESSION } from './types'
const ObjectId = mongoose.Schema.Types.ObjectId
const mongoosePaginate = require('mongoose-paginate-v2');
const stagesHistorySchema = new Schema({
  stageName: {
    type: String
  },
  stageDate: {
    type: Date
  }
});
const multiSignerListSchema = new Schema({
  id: {
    type: String
  },
  email: {
    type: String
  }
});
const costOfNotarizationSchema = new Schema({
  name: {
    type: String
  },
  price: {
    type: String
  },
  currency: {
    type: String
  }
});
const sessionCustomChargesSchema = new Schema({
  id: {
    type: String
  },
  particular: {
    type: String
  },
  amount: {
    type: String
  }
});
export const NewSessionSchema: Schema<INEWSESSION> = new mongoose.Schema(
  {
    sessionid: String,
    userId: {
      type: ObjectId,
      ref: 'User'
    },
    sessionCode: {
      type: String
    },
    notaryUserId: {
      type: ObjectId,
      ref: 'User'
    },
    currentStage: {
      type: String,
      enum: ['initial_stage', 'identity_check_stage', 'identity_check_stage_fail', 'kba_check_stage', 'kba_check_stage_fail', 'photoid_check_stage', 'photoid_check_stage_fail', 'payment_info_stage', 'meet_notary_stage']
    },
    originalDocumentId: {
      type: ObjectId,
      ref: 'Document'
    },
    originalDocumentIds: {
      type: Array
    },
    finalDocumentId: {
      type: ObjectId,
      ref: 'Document'
    },
    videoFileDocumentId: {
      type: ObjectId,
      ref: 'Document'
    },
    finalDocumentIdWithDC: {
      type: ObjectId,
      defualt: ''
    },
    x509Certificate: {
      type: String
    },
    stagesHistory: [stagesHistorySchema],
    multiSignerList: [multiSignerListSchema],
    meetingdate: {
      type: String
    },
    meetingdatetimeobj: {
      type: Date
    },
    meetingTimeZone: {
      type: String
    },
    attachCertificate: {
      type: Boolean
    },
    paid: {
      type: Boolean
    },
    sessionActive: {
      type: Boolean
    },
    sessionActiveFrom: {
      type: Date
    },
    notorizationType: {
      type: String,
      default: 'Acknowledgement'
    },
    costOfNotarization: [costOfNotarizationSchema],
    finalCostOfNotarization: {
      type: String
    },
    emptyPagesAdded: {
      type: Number
    },
    emptyPagesAddedDocIdWise: {
      type: Object
    },
    status: {
      type: String
    },
    failMessage: {
      type: String
    },
    stripePaymentData: {
      type: Array
    },
    kbaStartedAt: {
      type: Date
    },
    notorizationTiming: {
      type: String
    },
    sessionOpenCallForTaking: {
      type: Boolean
    },
    sessionOpenCallForTakingAt: {
      type: Date
    },
    sessionOpenCallForWitness: {
      type: Boolean
    },
    sessionOpenCallForWitnessAt: {
      type: Date
    },
    maxWitnessJoined: {
      type: Number
    },
    videoSavingProcessingStage: {
      type: String
    },
    videoSavingProcessingError: {
      type: String
    },
    sessionType: {
      type: String
    },
    sessionCustomCharges: [sessionCustomChargesSchema]
  },
  {
    versionKey: false,
    timestamps: true
  }
)
NewSessionSchema.plugin(mongoosePaginate);
export const NewSessionModel = mongoose.model<INEWSESSION>('newsessions', NewSessionSchema);
