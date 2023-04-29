# ddc-source-cmdline

Command line completion for ddc.vim

This source collects items from `getcompletion('cmdline')`. It is useful for
command line completion.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddc.vim

https://github.com/Shougo/ddc.vim

## Configuration

```vim
call ddc#custom#patch_global('sources', ['cmdline'])

call ddc#custom#patch_global('sourceOptions', #{
      \   cmdline: #{
      \     mark: 'cmdline',
      \   }
      \ })
```
