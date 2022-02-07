import {
  BaseSource,
  Candidate,
  Context,
  DdcOptions,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v0.15.0/types.ts#^";
import { Denops, fn } from "https://deno.land/x/ddc_vim@v0.15.0/deps.ts#^";
import { Env } from "https://deno.land/x/env@v2.2.0/env.js#^";

const env = new Env();

export class Source extends BaseSource<{}> {
  async gatherCandidates(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    completeStr: string;
  }): Promise<Candidate[]> {
    let results: string[] = [];

    try {
      results = await fn.getcompletion(
        args.denops,
        args.context.input,
        "cmdline",
      ) as string[];
    } catch (_) {
      // Ignore errors
      //console.log(_);
    }
    if (results.length == 0) {
      return [];
    }

    // Replace home directory.
    const home = env.get("HOME", "");
    if (home != "") {
      results = results.map((word) => word.replace(home, "~"));
    }

    let prefix = results[0].toLowerCase();
    results.forEach((word) => {
      while (!word.toLowerCase().startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
    });

    const input = args.context.input.toLowerCase();
    while (!input.endsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
    if (prefix != "" && prefix != args.completeStr) {
      prefix = prefix.substring(args.completeStr.length);
      results = results.map((word) => word.substring(prefix.length));
    }
    return results.map(
      (word) => (word.endsWith("/")
        ? { word: word.slice(0, -1), abbr: word }
        : { word })
    );
  }

  params(): {} {
    return {};
  }
}
