""""""""""""""""""""""""
" Startup commands
""""""""""""""""""""""""
runtime bundle/vim-pathogen/autoload/pathogen.vim
execute pathogen#infect()

" Make vim close is NERDTree is only open window
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTreeType") && b:NERDTreeType == "primary") | q | endif

""""""""""""""""""""""""
" General settings
""""""""""""""""""""""""

filetype plugin indent on

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

" Set window split preferences
set splitbelow
set splitright


set number "turn on line numbers

set backspace=indent,eol,start "Make backspace a more flexible

set mouse=a " use the mouse everywhere
set wildmenu " turn on command line completetion wild style
set ruler
set showcmd "show commands

" Change timeout length
set timeoutlen=300


""""""""""""""""""""""""
" Key remappings
""""""""""""""""""""""""

" Remap VIM 0 to first non-blank character
map 0 ^
" Remap - to $ to go to end of line
map - $
" Remap : to ; to avoid shifts
map ; :
"jj to enter command mode and not move cursor back 
inoremap jj <Esc>l
" Make it easier to move to different split windows
nnoremap <C-J> <C-W><C-J>
nnoremap <C-K> <C-W><C-K>
nnoremap <C-L> <C-W><C-L>
nnoremap <C-H> <C-W><C-H>


""""""""""""""""""""""""
" Leader shortcuts
""""""""""""""""""""""""
let mapleader='\'
map <Leader>t :NERDTree<CR>
