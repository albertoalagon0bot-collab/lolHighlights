const mongoose = require('mongoose');

const SummonerSchema = new mongoose.Schema({
  summonerId: {
    type: String,
    required: true,
    unique: true
  },
  puuid: {
    type: String,
    required: true,
    unique: true
  },
  accountId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  profileIconId: {
    type: Number
  },
  summonerLevel: {
    type: Number
  },
  region: {
    type: String,
    required: true,
    enum: Object.keys({
      br1: 1, eun1: 1, euw1: 1, jp1: 1, kr: 1, la1: 1, la2: 1, na1: 1, oc1: 1, tr1: 1, ru: 1
    })
  },
  lastMatchFetchedAt: {
    type: Date
  },
  matchesCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

SummonerSchema.index({ name: 1, region: 1 });
SummonerSchema.index({ region: 1 });

SummonerSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Summoner', SummonerSchema);
