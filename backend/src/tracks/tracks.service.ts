import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';

import { MembersService } from '@members/members.service';
import { SettingsService } from '@members/settings.service';
import { MEMBER_ROLE } from '@members/enums/types.enum';
import { UpdateTrackData } from './data/update-track.data';
import { CreateTrackData, MemberInfo } from './data/create-track.data';
import { FilterTrackData } from './data/filter-track.data';
import { ITrack } from './interfaces/track.interface';
import { MULTIPLIER } from './enums/types.enum';

@Injectable()
export class TrackService {
  constructor(
    @Inject('TRACK_MODEL') private readonly trackModel: Model<ITrack>,
    private readonly membersService: MembersService,
    private readonly settingsService: SettingsService,
  ) {}

  async getTracks(filter: FilterTrackData) {
    return this.trackModel.find(filter).sort({ createdAt: -1 });
  }

  async deleteTrack(id: string) {
    const track = await this.trackModel.findOne({
      _id: id,
    });

    if (track) {
      const member = await this.membersService.findMember(track.nickname);

      const existedSeasonIndex = member.seasons.findIndex(
        (season) =>
          season.season === track.season && season.year === track.year,
      );

      member.seasons[existedSeasonIndex].coins -= track.coins;

      if (member) {
        const updatedMember = {
          nickname: member.nickname,
          coins: Number(member.coins) - Number(track.coins),
          types: member.types,
          seasons: member.seasons,
        };

        await this.membersService.updateMember(updatedMember);
      }

      await this.trackModel.deleteOne({
        _id: id,
      });
    }

    return;
  }

  async getTrackSeasons() {
    return this.trackModel.aggregate([
      {
        $group: {
          _id: '$season',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async updateTrack(id: string, track: UpdateTrackData) {
    await this.trackModel.updateOne(
      {
        _id: id,
      },
      {
        $set: track,
      },
    );

    const updatedTrack = await this.trackModel.findOne({
      _id: id,
    });

    return updatedTrack;
  }

  private getCoinsWithMultipliers(
    multipliers: Omit<CreateTrackData, 'membersInfo'>,
    member: MemberInfo,
  ) {
    if (member.isGuest && member.coins) member.coins = member.coins / 2;

    let additionalCoins = 0;

    if (multipliers.isFast) {
      additionalCoins += member.coins * MULTIPLIER.FAST;
    }
    if (multipliers.isOngoing) {
      additionalCoins += member.coins * MULTIPLIER.ONGOING;
    }
    if (multipliers.isPriority) {
      additionalCoins += member.coins * MULTIPLIER.PRIORITY;
    }
    if (multipliers.isInTime) {
      additionalCoins += member.coins * MULTIPLIER.IN_TIME;
    }

    member.coins += additionalCoins;

    return member;
  }

  private addAdditionalCoinsToTranslator(track: CreateTrackData, role: string) {
    const subIndex = track.membersInfo.findIndex(
      (member) => member.typeRole === MEMBER_ROLE.SUB,
    );

    track.membersInfo[subIndex].coins +=
      this.settingsService.getCoins()[track.titleType][role];
  }

  async createTrack(track: CreateTrackData) {
    if (track.isGiveEditorCoins)
      this.addAdditionalCoinsToTranslator(track, 'editor');
    if (track.isGiveTypesetterCoins)
      this.addAdditionalCoinsToTranslator(track, 'typesetter');

    for (const member of track.membersInfo) {
      const existedMember = await this.membersService.findMember(
        member.nickname,
      );

      const memberWithMultipliers = this.getCoinsWithMultipliers(track, member);

      await this.trackModel.create({
        ...memberWithMultipliers,
        ...track,
        year: Number(track.year),
      });

      const existedSeasonIndex = existedMember.seasons.findIndex(
        (season) =>
          season.season === track.season && season.year === track.year,
      );

      if (existedSeasonIndex !== -1) {
        existedMember.seasons[existedSeasonIndex].coins +=
          memberWithMultipliers.coins;
      } else {
        existedMember.seasons.push({
          season: track.season,
          year: track.year,
          coins: memberWithMultipliers.coins,
        });
      }

      const updatedMember = {
        nickname: member.nickname,
        coins:
          Number(existedMember.coins) + Number(memberWithMultipliers.coins),
        types: existedMember.types.includes(member.typeRole)
          ? existedMember.types
          : [...existedMember.types, member.typeRole],
        seasons: existedMember.seasons,
      };

      await this.membersService.updateMember(updatedMember);
    }

    return 'Success';
  }
}
