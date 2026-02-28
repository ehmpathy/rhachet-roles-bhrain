import { given, then, when } from 'test-fns';

import { PassageReport } from './PassageReport';

describe('PassageReport', () => {
  given('[case1] a valid passed report', () => {
    when('[t0] instantiated', () => {
      then('it should create the report', () => {
        const report = new PassageReport({
          stone: '1.vision',
          status: 'passed',
        });
        expect(report.stone).toEqual('1.vision');
        expect(report.status).toEqual('passed');
        expect(report.blocker).toBeUndefined();
        expect(report.reason).toBeUndefined();
      });
    });
  });

  given('[case2] a valid approved report', () => {
    when('[t0] instantiated', () => {
      then('it should create the report', () => {
        const report = new PassageReport({
          stone: '1.vision',
          status: 'approved',
        });
        expect(report.stone).toEqual('1.vision');
        expect(report.status).toEqual('approved');
      });
    });
  });

  given('[case3] a valid blocked report', () => {
    when('[t0] instantiated with blocker and reason', () => {
      then('it should create the report with all fields', () => {
        const report = new PassageReport({
          stone: '3.3.blueprint.v1',
          status: 'blocked',
          blocker: 'review.self',
          reason: 'review.self required',
        });
        expect(report.stone).toEqual('3.3.blueprint.v1');
        expect(report.status).toEqual('blocked');
        expect(report.blocker).toEqual('review.self');
        expect(report.reason).toEqual('review.self required');
      });
    });
  });

  given('[case4] serialization', () => {
    when('[t0] JSON serialized', () => {
      then('it should produce valid JSON', () => {
        const report = new PassageReport({
          stone: '1.vision',
          status: 'passed',
        });
        const json = JSON.stringify(report);
        const parsed = JSON.parse(json);
        expect(parsed.stone).toEqual('1.vision');
        expect(parsed.status).toEqual('passed');
      });
    });
  });
});
