syntax on

set nocompatible "explicitly get out of vi-compatible mode

" Setting tab width to 4 spaces
set tabstop=4       " The width of a TAB is set to 4.
                    " Still it is a \t. It is just that
                    " Vim will interpret it to be having
                    " a width of 4.
set shiftwidth=4    " Indents will have a width of 4
set softtabstop=4   " Sets the number of columns for a TAB
set expandtab       " Expand TABs to spaces

" Setting autoindent preferences
set autoindent      " turns on autoindent
set smartindent

set number "turn on line numbers

set backspace=indent,eol,start "Make backspace a more flexible

set mouse=a " use the mouse everywhere
set wildmenu " turn on command line completetion wild style
set ruler


""""""""""""""""""""""""
" Key remappings
""""""""""""""""""""""""

" Remap VIM 0 to first non-blank character
map 0 ^

"jj to enter command mode 
inoremap jj <Esc>

