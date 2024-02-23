export interface Changes {
  added: number;
  removed: number;
  filesChanged: number;
  stdout: string;
}

export const countChanges = async (
  stdout: string
): Promise<Changes | undefined> => {
  try {
    if (!stdout) {
      return undefined;
    }
    const regex = {
      insertion: /(\d+) insertion/,
      deletion: /(\d+) deletion/,
      modified: /(\d+) file/
    };

    const parse = (reg: RegExp): number => {
      const list = reg.exec(stdout);
      if (!list) {
        return 0;
      }
      return +list[1];
    };

    const counts = Object.values(regex).map(parse);
    return {
      added: counts[0],
      removed: counts[1],
      filesChanged: counts[2],
      stdout
    };
  } catch {
    return undefined;
  }
};

const formatCount = (count: number) => {
  if (count > 1000) {
    return count.toFixed(1);
  }
  return count.toString();
};

export const formatChanges = (changes: Changes) => {
  return (
    [
      ['$(diff-added)', changes.added],
      ['$(diff-removed)', changes.removed],
      ['$(file)', changes.filesChanged]
    ] as const
  )
    .map((v) => `${v[0]} ${formatCount(v[1])}`)
    .join(' ');
};
