# Licensed Materials - Property of HCL and/or IBM
# Copyright HCL Technologies Ltd. 2016, 2019. All Rights Reserved.
# Copyright IBM Corporation 1999, 2016. All Rights Reserved.
#
# U.S. Government Users Restricted Rights -  Use, duplication or 
# disclosure restricted by GSA ADP Schedule.


VENDOR        = gnu
EXEC_EXT      = .EXE
SHLIB_CMD     = $(CC) -shared -z text -o

SHLIBCCFLAGS  = -fPIC
SHLIBS        =


LIBSETCCFLAGS = -fno-exceptions -pthread -D_MT -fpermissive


LIBSETCCEXTRA = -O4 -finline -finline-functions -fno-builtin -Wall -Winline -Wwrite-strings -fpermissive


LIBSETLDFLAGS = -pthread


CC = arm-linux-gnueabihf-g++


LD = arm-linux-gnueabihf-g++


AR_CMD = $(PERL) "$(RTS_HOME)/tools/ar.pl" -create=arm-linux-gnueabihf-ar,rc -add=arm-linux-gnueabihf-ar,r -ranlib=arm-linux-gnueabihf-ranlib -suffix=$(OBJ_EXT) -limit=4000
