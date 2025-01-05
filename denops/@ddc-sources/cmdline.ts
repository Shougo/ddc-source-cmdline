import {
  type Context,
  type DdcOptions,
  type Item,
  type Previewer,
  type SourceOptions,
} from "jsr:@shougo/ddc-vim@~9.1.0/types";
import { BaseSource } from "jsr:@shougo/ddc-vim@~9.1.0/source";

import type { Denops } from "jsr:@denops/core@~7.0.0";
import * as fn from "jsr:@denops/std@~7.4.0/function";

type Params = Record<string, never>;

export class Source extends BaseSource<Params> {
  override async gather(args: {
    denops: Denops;
    context: Context;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    completeStr: string;
  }): Promise<Item[]> {
    let results: string[] = [];

    // Get completion type
    const cmdType = await fn.getcmdtype(args.denops);
    if (
      cmdType == "/" || cmdType == "?" || cmdType == ">" || cmdType == "=" ||
      cmdType == "@"
    ) {
      // No completion
      return [];
    }

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

    // Replace home directory.
    const home = Deno.env.get("HOME");
    if (home && home != "") {
      results = results.map((word) => word.replace(home, "~"));
    }

    // Replace no- options.
    // NOTE: getcompletion() does not return no- prefixed items.
    if (
      args.completeStr.startsWith("no") && args.context.input.startsWith("set")
    ) {
      results = results.map((word) => "no" + word);
    }

    // Filter for ":help".
    // NOTE: getcompletion() returns non head matched items.
    if (args.context.input.startsWith("help ")) {
      const prefix = args.context.input.replace(/^help\s+/, "").toLowerCase();
      results = results.filter(
        (word) => word.toLowerCase().startsWith(prefix),
      );
    }

    if (results.length == 0) {
      return [];
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

    // NOTE: "**/foo.txt" result must be matched to "foo.txt"
    const lastSlashIndex = args.completeStr.lastIndexOf("/");
    const suffix = args.completeStr.substring(lastSlashIndex + 1).toLowerCase();
    if (suffix != "" && suffix != args.completeStr) {
      results = results.filter((result) => {
        const lastSlashIndex = result.lastIndexOf("/");
        const resultSuffix = result.substring(lastSlashIndex + 1).toLowerCase();
        return resultSuffix.startsWith(suffix);
      });
    }

    return results.map(
      (
        word,
      ) => (word.endsWith("/")
        ? { word: word.slice(0, -1), abbr: word }
        : { word }),
    );
  }

  override async getPreviewer(args: {
    denops: Denops;
    item: Item;
  }): Promise<Previewer> {
    const help = await fn.getcompletion(args.denops, args.item.word, "help");
    if (help.length === 0) {
      return {
        kind: "empty",
      };
    } else {
      return {
        kind: "help",
        tag: args.item.word,
      };
    }
  }

  override params(): Params {
    return {};
  }
}
