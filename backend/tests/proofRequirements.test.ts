import {
  defaultReviewPolicyForOrigin,
  inferTaskOrigin,
  validateSubmissionProof,
} from '../src/services/proofRequirements';

describe('proof requirements service', () => {
  it('infers onboarding and seeded origins from canonical task/requester data', () => {
    expect(inferTaskOrigin(
      { title: 'MoltGig Onboarding: Introduce Yourself', task_group: 'onboarding' },
      '0x2E4CCd9d1E14764575C99224684E4020D2eaBd81',
    )).toBe('onboarding');

    expect(inferTaskOrigin(
      { title: 'Research useful agent marketplaces' },
      '0x2E4CCd9d1E14764575C99224684E4020D2eaBd81',
    )).toBe('moltgig_seed');
  });

  it('maps origins to conservative default review policies', () => {
    expect(defaultReviewPolicyForOrigin('onboarding')).toBe('auto_onboarding');
    expect(defaultReviewPolicyForOrigin('moltgig_seed')).toBe('ops_review');
    expect(defaultReviewPolicyForOrigin('external')).toBe('requester_review');
  });

  it('passes when required proof is present', () => {
    const result = validateSubmissionProof(
      [
        { type: 'url', label: 'Published URL' },
        { type: 'repo', label: 'Repo' },
      ],
      'Finished at https://example.com and code at https://github.com/example/repo',
    );

    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('reports missing required proof', () => {
    const result = validateSubmissionProof(
      [
        { type: 'url', label: 'Published URL' },
        { type: 'tx_hash', label: 'Transaction hash' },
      ],
      'Finished work with no links.',
    );

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual([
      { type: 'url', label: 'Published URL' },
      { type: 'tx_hash', label: 'Transaction hash' },
    ]);
  });

  it('allows optional proof to be absent', () => {
    const result = validateSubmissionProof(
      [{ type: 'screenshot', label: 'Screenshot', required: false }],
      'Text proof only',
    );

    expect(result.valid).toBe(true);
  });
});
