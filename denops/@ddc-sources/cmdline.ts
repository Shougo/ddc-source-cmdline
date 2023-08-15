import {
  BaseSource,
  Context,
  DdcOptions,
  Item,
  Previewer,
  SourceOptions,
} from "https://deno.land/x/ddc_vim@v4.0.4/types.ts";
import { Denops, fn } from "https://deno.land/x/ddc_vim@v4.0.4/deps.ts";
import { Env } from "https://deno.land/x/env@v2.2.3/env.js";

const env = new Env();

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
    const home = env.get("HOME", "");
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
        (word) => word.toLowerCase().startsWith(prefix));
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
    return results.map(
      (
        word,
      ) => (word.endsWith("/")
        ? { word: word.slice(0, -1), abbr: word }
        : { word }),
    );
  }

  override async getPreviewer(args: {
    denops: Denops,
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
