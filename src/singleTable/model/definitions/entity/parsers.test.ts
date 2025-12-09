import { getEntityParserProps } from './parsers';

describe('entity parser', () => {
  it('should not be defined if no _extend_', () => {
    const props = getEntityParserProps({});

    expect(props.parser).toBe(undefined);
  });

  it('should return its params plus any overwritten/new prop from _extend_', () => {
    const props = getEntityParserProps({
      extend: ({ dob }) => ({
        someProp: 'y!',
        overwritten: 'new',
        ref: false,
        age: `calculated-age-${dob}`,
      }),
    });

    const result = props.parser({
      id: '11',
      overwritten: 'old',
      dob: '2024-01-01',
    });

    expect(result).toStrictEqual({
      id: '11',
      dob: '2024-01-01',
      someProp: 'y!',
      overwritten: 'new',
      ref: false,
      age: 'calculated-age-2024-01-01',
    });
  });
});
