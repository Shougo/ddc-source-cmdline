# ddc-cmdline

Command line completion for ddc.vim

This source collects candidates from `getcompletion('cmdline')`. It is useful
for command line completion.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddc.vim

https://github.com/Shougo/ddc.vim

## Configuration

```vim
" Use cmdline source.
call ddc#custom#patch_global('sources', ['cmdline'])

" Change source options
call ddc#custom#patch_global('sourceOptions', {
      \   'cmdline': {
      \     'mark': 'cmdline',
      \   }
      \ })
```
