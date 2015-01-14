syntax on

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

" Turn on line numbers
set number

" Key remappings

"jj to enter command mode 
inoremap jj <Esc>

"automatic closing parens
inoremap ( ()<Esc>i
inoremap [ []<Esc>i
inoremap { {}<Esc>i
inoremap {<CR> {<CR>}<Esc>ko
