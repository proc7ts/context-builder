import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxPeerBuilder } from './peer-builder';

describe('CxPeerBuilder', () => {
  let peer: CxPeerBuilder;

  beforeEach(() => {
    peer = new CxPeerBuilder();
  });

  describe('context', () => {
    it('is not available', () => {
      expect(() => peer.context).toThrow(new TypeError('Peer context is not available'));
    });
  });
});
